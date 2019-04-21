'''Train CIFAR10 with PyTorch.'''
from __future__ import print_function

from sklearn import metrics
import torch

from tensorboardX import SummaryWriter
from torchsummary import summary
# from data_reader_isic import get_data_loaders
from utils.utils_all import *
from torch.backends import cudnn
device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
import os
import numpy as np
import argparse
from data_reader import get_test_loader_for_upload, get_validation_loader_for_upload
from models import *
from utils.utils_all import progress_bar
from file_utils import save_to_file
from data_reader import height, width
from utils.pytorch_utils import *

parser = argparse.ArgumentParser(description='PyTorch CIFAR10 Training')
parser.add_argument('--lr', default=0.1, type=float, help='learning rate')
parser.add_argument('--resume', '-r', action='store_true', help='resume from checkpoint')
args = parser.parse_args()

device = 'cuda' if torch.cuda.is_available() else 'cpu'

class Classifier(object):
    def __init__(self,model_details):
        self.device_ids=[0,1]
        self.model_details=model_details
        self.log_dir=self.model_details.logs_dir
        if not os.path.exists(self.log_dir):
            os.makedirs(self.log_dir)
        self.writer = SummaryWriter(self.log_dir)
        self.use_cuda = torch.cuda.is_available()
        self.best_acc = 0  # best test accuracy
        self.start_epoch = 0  # start from epoch 0 or last checkpoint epoch
        self.net = None
        self.get_loss_function = model_details.get_loss_function
        self.optimizer = None
        self.criterion = None

        self.model_name_str = None

    def load_data(self):
        print('==> Preparing data of {}..'.format(self.model_details.dataset))
        self.trainloader, self.testloader = self.model_details.dataset_loader #[trainloader, test_loader]
        train_count = len(self.trainloader) * self.model_details.batch_size
        test_count = len(self.testloader) * self.model_details.batch_size
        print('==> Total examples, train: {}, test:{}'.format(train_count, test_count))

    def load_model(self):
        model_details=self.model_details
        model_name_str = model_details.model_name_str
        print('\n==> using model {}'.format(model_name_str))
        self.model_name_str="{}".format(model_name_str)
        self.best_saved_model_name = './checkpoint/{}/{}_best_ckpt.t7'.format(model_details.gpu,self.model_name_str)
        print(self.best_saved_model_name)
        model = model_details.model

        if self.use_cuda:
            model=model.cuda()
            model = torch.nn.DataParallel(model)
            cudnn.benchmark = True
        self.model=model
        # Model
        try:
            # Load checkpoint.
            assert (os.path.isdir('checkpoint'), 'Error: no checkpoint directory found!')
            checkpoint = torch.load(self.best_saved_model_name)
            model.load_state_dict(checkpoint['model'].state_dict())
            self.best_acc = checkpoint['acc']
            self.start_epoch = checkpoint['epoch']+1
            print('==> Resuming Successfully from checkpoint from epoch {}..'.format(self.start_epoch))

        except Exception as e:
            print(e)
            print('==> Resume Failed and Building model..')

        optimizer, scheduler=self.model_details.get_optimizer(self)
        self.optimizer=optimizer
        self.scheduler=scheduler
        self.criterion=self.model_details.get_loss_function(self)

    def adjust_weight_with_steps(self):
        pass


    # Training
    def train(self, epoch):
        print('\nTraining Epoch: %d' % epoch)
        show_params_trainable(self.model_details.model)
        model=self.model
        model.train()
        train_loss = 0
        correct = 0
        total = 0
        epoch_loss = []
        show_params_trainable(model)
        for batch_idx, (inputs, targets) in enumerate(self.trainloader):
            # if batch_idx > 10:
            #     break
            step = epoch * len(self.trainloader) + batch_idx
            # if not self.augment_images==None:
            #     inputs=torch.from_numpy(self.augment_images(inputs.numpy()))
            inputs, targets = inputs.to(device), targets.to(device)
            self.optimizer.zero_grad()
            outputs = model(inputs)
            loss = self.criterion(outputs, targets)
            loss.backward()
            self.optimizer.step()
            item_loss = loss.item()
            epoch_loss.append(item_loss)
            train_loss += item_loss
            _, predicted = outputs.max(1)
            batch_loss = train_loss / (batch_idx + 1)
            if batch_idx % 5 == 0:
                self.writer.add_scalar('step loss', batch_loss, step)
            total += targets.size(0)
            correct += predicted.eq(targets.data).cpu().sum()

            progress_bar(batch_idx, len(self.trainloader), 'Train Epoch:%d, Loss: %.3f | Acc: %.3f%% (%d/%d)'
                         % (epoch, batch_loss, 100. * correct / total, correct, total))

        self.writer.add_scalar('train loss',train_loss, epoch)

    def save_model(self, acc, epoch,save_model_path):
        print('\n Saving new model with accuracy {}'.format(acc))
        state = {
            'model': self.model,
            'acc': acc,
            'epoch': epoch,
        }
        if not os.path.isdir('checkpoint'):
            os.mkdir('checkpoint')
        torch.save(state, save_model_path)

    def create_submit_file(self,type,model,epoch,loader_for_upload):
        scores_for_upload = []
        scores_for_upload.append("image,MEL,NV,BCC,AKIEC,BKL,DF,VASC")

        with torch.no_grad():

            for batch_idx, (inputs) in enumerate(loader_for_upload):
                inputs = inputs.to(device)
                outputs = model(inputs)
                start_index = batch_idx * self.model_details.batch_size
                end_index = min(start_index + self.model_details.batch_size, len(loader_for_upload.dataset))
                j = 0
                out_probs = F.softmax(outputs, dim=1)
                for index in range(start_index, end_index):
                    image = loader_for_upload.dataset.images[index]
                    image_id = os.path.basename(image).split('.')[0]
                    probs = out_probs.cpu().data.numpy()[j]
                    #  score_row = "{id} {mel:.3f} {nv:.3f} {bcc:.3f} {akiec:.3f} {bkl:.3f} {df:.3f} {vasc:.3f}".format(id=image_id,**probs)
                    score_row = "{id},{:.3f},{:.3f},{:.3f},{:.3f},{:.3f},{:.3f},{:.3f}".format(id=image_id, *probs)
                    scores_for_upload.append(score_row)
                    j += 1
                    progress_bar(batch_idx,len(loader_for_upload),"{} creating submission file".format(type))
            gpu = self.model_details.gpu
            # if gpu == None:
            #     csv__format = 'res_{}/result_{}_epoch_{}_valloss_{:.3f}.csv'.format(gpu,type,epoch,self.val_loss)
            # else:
            model_name_str = self.model_details.model_name_str
            csv__format = 'res_{}/result_gpu_{}_{}_epoch_{}.csv'.format(model_name_str,gpu,type,epoch)
            create_dir_if_not_exists(os.path.dirname(csv__format))
            save_to_file(csv__format, scores_for_upload)
            print("File saved:{}".format(csv__format))

    def test(self, epoch):
        model = self.model
        model.eval()
        gpu = self.model_details.gpu

        epoch_saved_model_name = 'D:\\imagedata\\result\\{}_epoch_{}_ckpt.t7'.format(gpu, self.model_name_str, epoch)

        self.save_model(100, epoch,epoch_saved_model_name)
        test_loader=get_test_loader_for_upload(self.model_details.batch_size)
        val_loader=get_validation_loader_for_upload(self.model_details.batch_size)

        self.create_submit_file('valid',model,epoch,val_loader)
        # self.create_submit_file('test',model,epoch,test_loader)
        # if acc>self.best_acc:
        #     self.best_acc = acc
        #     self.save_model(acc, epoch, best_saved_model_name)


    #
    def validate(self,epoch):
        model=self.model
        model.eval()
        val_loss = 0
        correct = 0
        total = 0
        target_all = []
        predicted_all = []
        with torch.no_grad():
            for batch_idx, (inputs, targets) in enumerate(self.testloader):
                # if batch_idx > 10:
                #     break
                inputs, targets = inputs.to(device), targets.to(device)
                outputs = model(inputs)
                loss = self.criterion(outputs, targets)
                val_loss += loss.item()
                predicted_values, predicted = outputs.max(1)
                predicted_reshaped = predicted.cpu().numpy().reshape(-1)
                predicted_all = np.concatenate((predicted_all, predicted_reshaped), axis=0)
                targets_reshaped = targets.data.cpu().numpy().reshape(-1)
                target_all = np.concatenate((target_all, targets_reshaped), axis=0)
                total += targets.size(0)
                correct += predicted.eq(targets).sum().item()
                progress_bar(batch_idx, len(self.testloader), 'Validation Loss: %.3f | Acc: %.3f%% (%d/%d)'
                             % (val_loss / (batch_idx + 1), 100. * correct / total, correct, total))
                start_index = batch_idx * self.model_details.batch_size
                end_index =min( start_index + self.model_details.batch_size, len(self.testloader.dataset))
                # j=0
                # out_probs=F.softmax(outputs,dim=1)
                # for index in range(start_index,end_index):
                #     out=predicted_values[j]
                #     image=self.testloader.dataset.images[index][0]
                #     images.append(image)
                #     image_id = os.path.basename(image).split('.')[0]
                #     probs=out_probs.cpu().data.numpy()[j]
                #     #  score_row = "{id} {mel:.3f} {nv:.3f} {bcc:.3f} {akiec:.3f} {bkl:.3f} {df:.3f} {vasc:.3f}".format(id=image_id,**probs)
                #     score_row = "{id},{:.3f},{:.3f},{:.3f},{:.3f},{:.3f},{:.3f},{:.3f}".format(id=image_id,*probs)
                #     scores_for_upload.append(score_row)
                #     j+=1

        # Save checkpoint.
        self.scheduler.step(val_loss)
        self.val_loss=val_loss
        acc = 100. * correct / total
        self.val_acc=acc
        self.writer.add_scalar('test accuracy', acc, epoch)
        self.writer.add_scalar('test loss', val_loss, epoch)
        print("Accuracy:{}".format(acc))
        """
        on every epoch a model will be saved, a validation and test result fiel will be gnerated.
        submit those files on evaluation server, if they perform well replace the best model with new model and resume training.
        """

        cm = metrics.confusion_matrix(target_all, predicted_all)
        print("\nConfsusion metrics: \n{}".format(cm))

        self.test(epoch)

